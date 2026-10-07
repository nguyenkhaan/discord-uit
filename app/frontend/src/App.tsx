import { useQuery } from '@tanstack/react-query';
import { checkHealth } from './services/health.service';
import './App.css';

function App() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['healthCheck'],
    queryFn: checkHealth,
  });

  return (
    <div className="App" style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Kiểm tra kết nối Frontend - Backend</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        {isLoading && <p style={{ color: 'blue' }}>Đang kiểm tra kết nối đến Backend...</p>}
        
        {isError && (
          <div style={{ color: 'red' }}>
            <h2>Kết nối thất bại </h2>
            <p>{error instanceof Error ? error.message : 'Lỗi không xác định'}</p>
            <p>Hãy đảm bảo bạn đã khởi động Spring Boot Backend ở port 8080.</p>
          </div>
        )}
        
        {data && (
          <div style={{ color: 'green' }}>
            <h2>Kết nối thành công! </h2>
            <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px', color: '#333', textAlign: 'left' }}>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;