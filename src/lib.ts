import { useCallback, useSyncExternalStore } from 'react';
import { Draft, enableMapSet, enablePatches, Objectish, Patch, produceWithPatches } from 'immer';
import set from 'lodash/set';

enablePatches();
enableMapSet();

type Listener = () => void;
const generatePath = (path: string, key: string): string => {
    return path ? `${path}.${key}` : key;
};
type AnyObject = { [key: string]: any };

const findPath = (mainObject: AnyObject, target: any): string => {
    const stack: Array<{ obj: AnyObject, path: string }> = [{ obj: mainObject, path: '' }];

    while (stack.length > 0) {
        const { obj, path } = stack.pop()!;

        if (obj === target) {
            return path;
        }

        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const newPath = generatePath(path, key);
                    stack.push({ obj: obj[key], path: newPath });
                }
            }
        }
    }

    return "";
};

const generatePathFromSelector = (selector: (state: any) => any, state: any): string => {
    const result = selector(state);  // Ensure the selector accesses the properties
    return findPath(state, result);
};

function createStore<T extends object>(initialState: T) {
    let state: T = initialState;
    let listeners = new Map<string, Set<Listener>>();

    const subscribe = (path: string, listener: Listener) => {
        if (!listeners.has(path)) {
            listeners.set(path, new Set());
        }
        listeners.get(path)!.add(listener);
        return () => {
            listeners.get(path)!.delete(listener);
        };
    };

    const notifyListeners = (patches: Patch[]) => {
        const pathsToRemove = new Set<string>();

        patches.forEach(patch => {
            const path = patch.path.join('.');
            if (patch.op === 'remove') {
                pathsToRemove.add(path);
            } else if (listeners.has(path)) {
                listeners.get(path)!.forEach(listener => listener());
            }
        });

        // Remove listeners for deleted paths
        pathsToRemove.forEach(path => {
            listeners.delete(path);
        });
    };

    //const getState = () => state;

    const setState = (draft: (draftState: Draft<T>) => void) => {
        const [nextState, patches] = produceWithPatches(state, draft);
        state = nextState;
        notifyListeners(patches);
    };

    const useStore = <S extends Objectish>(selector: (state: T) => S): [S, (subDraft: (draft: Draft<S>) => void) => void] => {
        const path = generatePathFromSelector(selector, state);
        const getSelectedState = () => selector(state);


        const subscribeAndSync = useCallback((listener: Listener) => {
            const unsubscribe = subscribe(path, listener);
            listener();
            return unsubscribe;
        }, [path]);

        const selectedStateSync = useSyncExternalStore(subscribeAndSync, getSelectedState);

        const setSubState = useCallback(
            (subDraft: (draft: Draft<S>) => void) => {
                setState(mainDraft => {
                    const current = selector(state);

                    const [newSubDraft, patches, inverse] = produceWithPatches(current, subDraft);
                    console.log(patches, inverse)
                    set(mainDraft, path, newSubDraft);
                });
            },
            [path, selector]
        );

        return [selectedStateSync, setSubState];
    };

    return useStore;
}

export default createStore;
