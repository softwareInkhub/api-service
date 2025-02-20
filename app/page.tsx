import { routes } from 'app/config/routes';
import RouteGroup from 'app/components/RouteGroup';

export default function Home() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold">Welcome to API Testing Tool</h2>
      <p className="mt-4 text-gray-600">
        Select a tool from the sidebar to get started.
      </p>
    </div>
  );
}
