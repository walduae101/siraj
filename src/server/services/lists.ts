import { getDb } from "~/server/firebase/admin-lazy";
import { TRPCError } from "@trpc/server";

export type ListType = "ip" | "uid" | "emailDomain" | "device" | "bin";

export interface ListEntry {
  value: string;
  type: ListType;
  reason: string;
  addedBy: string;
  addedAt: Date;
  expiresAt?: Date;
  notes?: string;
}

export interface ListQuery {
  type: ListType;
  value: string;
}

export class ListsService {

  /**
   * Check if a value is in the denylist
   */
  async isDenied(query: ListQuery): Promise<boolean> {
    const db = await getDb();
    const doc = await db.collection("denylist").doc(query.type).collection(query.value).doc("entry").get();
    if (!doc.exists) return false;
    
    const data = doc.data()!;
    if (data.expiresAt && new Date(data.expiresAt.toDate()) < new Date()) {
      // Entry has expired, remove it
      await db.collection("denylist").doc(query.type).collection(query.value).doc("entry").delete();
      return false;
    }
    
    return true;
  }

  /**
   * Check if a value is in the allowlist
   */
  async isAllowed(query: ListQuery): Promise<boolean> {
    const db = await getDb();
    const doc = await db.collection("allowlist").doc(query.type).collection(query.value).doc("entry").get();
    if (!doc.exists) return false;
    
    const data = doc.data()!;
    if (data.expiresAt && new Date(data.expiresAt.toDate()) < new Date()) {
      // Entry has expired, remove it
      await db.collection("allowlist").doc(query.type).collection(query.value).doc("entry").delete();
      return false;
    }
    
    return true;
  }

  /**
   * Add entry to denylist
   */
  async addToDenylist(entry: Omit<ListEntry, "addedAt">): Promise<void> {
    this.validateEntry(entry);
    const db = await getDb();
    
    await db.collection("denylist").doc(entry.type).collection(entry.value).doc("entry").set({
      ...entry,
      addedAt: new Date(),
    });
  }

  /**
   * Add entry to allowlist
   */
  async addToAllowlist(entry: Omit<ListEntry, "addedAt">): Promise<void> {
    this.validateEntry(entry);
    const db = await getDb();
    
    await db.collection("allowlist").doc(entry.type).collection(entry.value).doc("entry").set({
      ...entry,
      addedAt: new Date(),
    });
  }

  /**
   * Remove entry from denylist
   */
  async removeFromDenylist(type: ListType, value: string): Promise<void> {
    const db = await getDb();
    await db.collection("denylist").doc(type).collection(value).doc("entry").delete();
  }

  /**
   * Remove entry from allowlist
   */
  async removeFromAllowlist(type: ListType, value: string): Promise<void> {
    const db = await getDb();
    await db.collection("allowlist").doc(type).collection(value).doc("entry").delete();
  }

  /**
   * List all entries in denylist
   */
  async listDenylist(type?: ListType): Promise<ListEntry[]> {
    const entries: ListEntry[] = [];
    
    if (type) {
      const db = await getDb();
      const snapshot = await db.collection("denylist").doc(type).listCollections();
      for (const subcollection of snapshot) {
        const doc = await subcollection.doc("entry").get();
        if (doc.exists) {
          const data = doc.data()!;
          if (!data.expiresAt || new Date(data.expiresAt.toDate()) >= new Date()) {
            entries.push({
              value: subcollection.id,
              type,
              reason: data.reason,
              addedBy: data.addedBy,
              addedAt: data.addedAt.toDate(),
              expiresAt: data.expiresAt?.toDate(),
              notes: data.notes,
            });
          }
        }
      }
    } else {
      const types: ListType[] = ["ip", "uid", "emailDomain", "device", "bin"];
      for (const listType of types) {
        const typeEntries = await this.listDenylist(listType);
        entries.push(...typeEntries);
      }
    }
    
    return entries.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  /**
   * List all entries in allowlist
   */
  async listAllowlist(type?: ListType): Promise<ListEntry[]> {
    const entries: ListEntry[] = [];
    
    if (type) {
      const db = await getDb();
      const snapshot = await db.collection("allowlist").doc(type).listCollections();
      for (const subcollection of snapshot) {
        const doc = await subcollection.doc("entry").get();
        if (doc.exists) {
          const data = doc.data()!;
          if (!data.expiresAt || new Date(data.expiresAt.toDate()) >= new Date()) {
            entries.push({
              value: subcollection.id,
              type,
              reason: data.reason,
              addedBy: data.addedBy,
              addedAt: data.addedAt.toDate(),
              expiresAt: data.expiresAt?.toDate(),
              notes: data.notes,
            });
          }
        }
      }
    } else {
      const types: ListType[] = ["ip", "uid", "emailDomain", "device", "bin"];
      for (const listType of types) {
        const typeEntries = await this.listAllowlist(listType);
        entries.push(...typeEntries);
      }
    }
    
    return entries.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  /**
   * Bulk check multiple values against lists
   */
  async bulkCheck(queries: ListQuery[]): Promise<{
    denied: ListQuery[];
    allowed: ListQuery[];
  }> {
    const denied: ListQuery[] = [];
    const allowed: ListQuery[] = [];

    await Promise.all(
      queries.map(async (query) => {
        const [isDenied, isAllowed] = await Promise.all([
          this.isDenied(query),
          this.isAllowed(query),
        ]);

        if (isDenied) {
          denied.push(query);
        } else if (isAllowed) {
          allowed.push(query);
        }
      })
    );

    return { denied, allowed };
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<{ denylist: number; allowlist: number }> {
    let denylistRemoved = 0;
    let allowlistRemoved = 0;

    const types: ListType[] = ["ip", "uid", "emailDomain", "device", "bin"];
    const db = await getDb();

    for (const type of types) {
      // Clean denylist
      const denylistSnapshot = await db.collection("denylist").doc(type).listCollections();
      for (const subcollection of denylistSnapshot) {
        const doc = await subcollection.doc("entry").get();
        if (doc.exists) {
          const data = doc.data()!;
          if (data.expiresAt && new Date(data.expiresAt.toDate()) < new Date()) {
            await subcollection.doc("entry").delete();
            denylistRemoved++;
          }
        }
      }

      // Clean allowlist
      const allowlistSnapshot = await db.collection("allowlist").doc(type).listCollections();
      for (const subcollection of allowlistSnapshot) {
        const doc = await subcollection.doc("entry").get();
        if (doc.exists) {
          const data = doc.data()!;
          if (data.expiresAt && new Date(data.expiresAt.toDate()) < new Date()) {
            await subcollection.doc("entry").delete();
            allowlistRemoved++;
          }
        }
      }
    }

    return { denylist: denylistRemoved, allowlist: allowlistRemoved };
  }

  private validateEntry(entry: Omit<ListEntry, "addedAt">): void {
    if (!entry.value || entry.value.trim().length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Value cannot be empty",
      });
    }

    if (!entry.reason || entry.reason.trim().length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Reason is required",
      });
    }

    if (!entry.addedBy || entry.addedBy.trim().length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Added by is required",
      });
    }

    // Type-specific validation
    switch (entry.type) {
      case "ip":
        if (!this.isValidIP(entry.value)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid IP address format",
          });
        }
        break;
      case "emailDomain":
        if (!this.isValidEmailDomain(entry.value)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid email domain format",
          });
        }
        break;
      case "bin":
        if (!this.isValidBIN(entry.value)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid BIN format (should be 6 digits)",
          });
        }
        break;
    }
  }

  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  private isValidEmailDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  }

  private isValidBIN(bin: string): boolean {
    return /^\d{6}$/.test(bin);
  }
}

export const listsService = new ListsService();
