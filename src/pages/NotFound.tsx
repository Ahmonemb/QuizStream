import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mb-3 text-3xl font-bold text-foreground">This QuizStream page is not available.</h1>
        <p className="mb-5 text-sm text-muted-foreground">Head back to the dashboard to keep learning.</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
