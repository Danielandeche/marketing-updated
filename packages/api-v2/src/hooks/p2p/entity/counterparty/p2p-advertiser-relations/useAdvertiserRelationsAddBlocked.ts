import { useCallback } from 'react';
import useAdvertiserRelations from './useAdvertiserRelations';

/** This hook blocks advertisers of the current user by passing the advertiser id. */
const useAdvertiserRelationsAddBlocked = () => {
    const { mutate, data, ...rest } = useAdvertiserRelations();

    const addBlockedAdvertiser = useCallback(
        (id: number[]) => {
            // Slice to max 5 elements and cast to one of the acceptable tuple types
            const adjustedId = id.slice(0, 5) as
                | [number]
                | [number, number]
                | [number, number, number]
                | [number, number, number, number]
                | [number, number, number, number, number];
            mutate({ payload: { add_blocked: adjustedId } });
        },
        [mutate]
    );

    return {
        data,
        /** Sends a request to block advertiser of the current user by passing the advertiser id. */
        mutate: addBlockedAdvertiser,
        ...rest,
    };
};

export default useAdvertiserRelationsAddBlocked;
