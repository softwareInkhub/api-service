import { routes } from 'app/config/routes';
import RouteGroup from 'app/components/RouteGroup';

export default function ActivityTester() {
  const groupedRoutes = routes.reduce((acc, route) => {
    if (!acc[route.group]) {
      acc[route.group] = [];
    }
    acc[route.group].push(route);
    return acc;
  }, {} as { [key: string]: typeof routes });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Activity Service</h2>
      {Object.entries(groupedRoutes).map(([group, routes]) => (
        <RouteGroup
          key={group}
          title={group.charAt(0).toUpperCase() + group.slice(1)}
          routes={routes}
        />
      ))}
    </div>
  );
} 