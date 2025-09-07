import StreamingTest from '~/components/test/StreamingTest';

export default function TestStreamingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Streaming Test Page
          </h1>
          <p className="text-gray-600">
            Test the live streaming functionality and essay quality specifications
          </p>
        </div>
        
        <StreamingTest />
      </div>
    </div>
  );
}
