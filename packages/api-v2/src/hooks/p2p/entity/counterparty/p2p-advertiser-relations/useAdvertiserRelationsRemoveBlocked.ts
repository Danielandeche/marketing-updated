import { useCallback } from 'react';
import useAdvertiserRelations from './useAdvertiserRelations';

/** This hook unblocks advertisers of the current user by passing the advertiser id. */
const useAdvertiserRelationsRemoveBlocked = () => {
    const { mutate, data, ...rest } = useAdvertiserRelations();

    const removeBlockedAdvertiser = useCallback(
        (id: number[]) => {
            // Slice to a max length of 5 and cast to the expected tuple types
            const adjustedId = id.slice(0, 5) as
                | [number]
                | [number, number]
                | [number, number, number]
                | [number, number, number, number]
                | [number, number, number, number, number];
            mutate({ payload: { remove_blocked: adjustedId } });
        },
        [mutate]
    );

    return {
        data,
        /** Sends a request to unblock advertiser of the current user by passing the advertiser id. */
        mutate: removeBlockedAdvertiser,
        ...rest,
    };
};

export default useAdvertiserRelationsRemoveBlocked;
