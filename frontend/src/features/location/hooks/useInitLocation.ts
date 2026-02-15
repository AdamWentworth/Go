// useInitLocation.ts

import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocationStore } from '@/features/location/store/useLocationStore';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('useInitLocation');

/**
 * Bootstraps geolocation logic on app startup.
 * Mount once from App bootstrap.
 */
export function useInitLocation() {
  const { isLoading: authLoading, updateUserDetails } = useAuth();
  const user = useAuthStore((s) => s.user);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setStatus = useLocationStore((s) => s.setStatus);

  const didInitialRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const storeAndLogCoords = (coords: { latitude: number; longitude: number }) => {
    setLocation(coords);
    setStatus('available');
    localStorage.setItem('location', JSON.stringify(coords));
    log.debug(
      `Location acquired and stored. Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`,
    );
  };

  useEffect(() => {
    const fetchLocation = () => {
      // 1) auth still loading.
      if (authLoading) {
        log.debug('Still loading user info, skipping location fetching.');
        return;
      }

      // 2) no user.
      if (!user) {
        log.debug('User not logged in. Skipping location fetching.');
        setStatus('unavailable');
        setLocation(null);
        localStorage.removeItem('location');
        return;
      }

      // 3) automatic geo allowed.
      if (user.allowLocation) {
        log.debug('User has allowed automatic location acquisition.');

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };

            storeAndLogCoords(coords);

            const changed =
              user.coordinates?.latitude !== coords.latitude ||
              user.coordinates?.longitude !== coords.longitude;

            if (changed) {
              log.debug('Coordinates changed; updating user in DB.');
              const res = await updateUserDetails(user.user_id, { coordinates: coords });

              if (!res.success) {
                log.error('Failed to update user coordinates in DB', res.error);
                toast.error('Failed to update your coordinates in the DB.');
              } else {
                log.debug('Coordinates updated in main & secondary DB.');
              }
            }
          },
          (error) => {
            log.error('Error acquiring location', error);
            toast.error(
              'Location services are disabled or unavailable. Please enable location services in your browser.',
            );
            setStatus('unavailable');
            setLocation(null);
            localStorage.removeItem('location');
          },
        );
        return;
      }

      // 4) auto disallowed, use manual coords.
      log.debug('User has disabled automatic location acquisition. Using manual coordinates if available.');

      if (
        user.coordinates &&
        typeof user.coordinates.latitude === 'number' &&
        typeof user.coordinates.longitude === 'number'
      ) {
        const manual = {
          latitude: user.coordinates.latitude,
          longitude: user.coordinates.longitude,
        };
        setLocation(manual);
        setStatus('available');
        localStorage.setItem('location', JSON.stringify(manual));
        log.debug(
          `Manual location set. Latitude: ${manual.latitude}, Longitude: ${manual.longitude}`,
        );
      } else {
        log.debug('No manual coordinates provided by user.');
        setStatus('unavailable');
        setLocation(null);
        localStorage.removeItem('location');
      }
    };

    // Initial + hourly refresh.
    if (!authLoading && user && !didInitialRef.current) {
      fetchLocation();
      didInitialRef.current = true;
      intervalRef.current = setInterval(() => {
        log.debug('Refreshing location...');
        fetchLocation();
      }, 60 * 60 * 1_000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authLoading, user, updateUserDetails, setLocation, setStatus]);
}
