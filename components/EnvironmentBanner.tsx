'use client';

import { useEffect, useState } from 'react';

const EnvironmentBanner = () => {
  const [isStaging, setIsStaging] = useState(false);

  useEffect(() => {
    const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'production';
    setIsStaging(appEnv === 'staging');
  }, []);

  if (!isStaging) {
    return null;
  }

  return (
    <div className="bg-orange-500 text-white text-center py-2 px-4 text-sm font-medium">
      🚧 STAGING ENVIRONMENT - This is for testing purposes only
    </div>
  );
};

export default EnvironmentBanner; 