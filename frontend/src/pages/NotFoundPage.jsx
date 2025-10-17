import { Card, CardContent, CardTitle } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { useNavigate } from 'react-router-dom';
import './page-layout.css';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page">
      <Card>
        <CardTitle>Page not found</CardTitle>
        <CardContent>
          <p>The page you are looking for does not exist or you may not have access.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Return to dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundPage;
