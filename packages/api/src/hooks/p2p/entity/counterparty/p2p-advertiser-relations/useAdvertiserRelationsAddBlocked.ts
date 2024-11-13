import { useCallback } from 'react';
import useAdvertiserRelations from './useAdvertiserRelations';

/** This hook blocks advertisers of the current user by passing the advertiser id. */
const useAdvertiserRelationsAddBlocked = () => {
    const { mutate, data, ...rest } = useAdvertiserRelations();

    const addBlockedAdvertiser = useCallback(
        (id: number[]) => {
            // Slice the array to a max length of 5 and cast to expected tuple types
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
