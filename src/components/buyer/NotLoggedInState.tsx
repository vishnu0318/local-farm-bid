
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const NotLoggedInState = () => {
  return (
    <Card className="p-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Please Log In</h2>
      <p className="mb-6 text-gray-600">
        You need to be logged in to view your bids
      </p>
      <Link to="/login">
        <Button>Log In</Button>
      </Link>
    </Card>
  );
};
