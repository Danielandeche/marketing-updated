import { useCallback } from 'react';
import useAdvertiserRelations from './useAdvertiserRelations';

const useAdvertiserRelationsRemoveBlocked = () => {
    const { mutate, data, ...rest } = useAdvertiserRelations();

    const removeBlockedAdvertiser = useCallback(
        (
            id:
                | [number]
                | [number, number]
                | [number, number, number]
                | [number, number, number, number]
                | [number, number, number, number, number]
        ) => {
            mutate({ payload: { remove_blocked: id } });
        },
        [mutate]
    );

    return {
        data,
        mutate: removeBlockedAdvertiser,
        ...rest,
    };
};

export default useAdvertiserRelationsRemoveBlocked;
