import { AuthGuard } from '../guards/AuthGuard';

const DashboardPage = () => {
  return (
    <AuthGuard>
      <div>
        <h1>Dashboard</h1>
        {/* Your protected dashboard content */}
      </div>
    </AuthGuard>
  );
};

export default DashboardPage; 