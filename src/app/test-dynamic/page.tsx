// Force dynamic rendering so middleware can execute
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function TestDynamicPage() {
  return (
    <div>
      <h1>Test Dynamic Page</h1>
      <p>This page should be dynamic and middleware should execute on it.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
