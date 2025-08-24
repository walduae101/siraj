// This module provides backward compatibility for direct imports
// It re-exports from the lazy module to ensure proper initialization
export { 
  getAdminAuth as getAuth,
  getDb as db,
  getAdminAuth as adminAuth
} from "./admin-lazy";
