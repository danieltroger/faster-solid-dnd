import {
  createContext,
  createEffect,
  ParentComponent,
  untrack,
  useContext,
} from "solid-js";
import { createStore, Store, unwrap } from "solid-js/store";

import { Id, useDragDropContext } from "./drag-drop-context";
import { moveArrayItem } from "./move-array-item";

interface SortableContextState {
  initialIds: Array<Id>;
  sortedIds: Array<Id>;
}

interface SortableContextProps {
  ids: Array<Id>;
}

type SortableContext = [Store<SortableContextState>, {}];

const Context = createContext<SortableContext>();

const SortableProvider: ParentComponent<SortableContextProps> = (props) => {
  const [dndState] = useDragDropContext()!;

  const [state, setState] = createStore<SortableContextState>({
    initialIds: [],
    sortedIds: [],
  });

  createEffect(() =>
    console.log("Other state", JSON.parse(JSON.stringify(state)))
  );

  const isValidIndex = (index: number): boolean => {
    return index >= 0 && index < state.initialIds.length;
  };

  createEffect(() => {
    setState("initialIds", [...props.ids]);
    setState("sortedIds", [...props.ids]);
  });

  createEffect(() => {
    if (dndState.active.draggableId && dndState.active.droppableId) {
      untrack(() => {
        const unwrapped = unwrap(state);
        // Doing indexOf calls the getter of every item in the array which is slow (because it's proxied), since this is untracked anyways,
        // we can gain performance by calling indexOf on the unwrapped (original) array (I think)
        const fromIndex = unwrapped.sortedIds.indexOf(
          dndState.active.draggableId!
        );
        const toIndex = unwrapped.initialIds.indexOf(
          dndState.active.droppableId!
        );

        if (!isValidIndex(fromIndex) || !isValidIndex(toIndex)) {
          setState("sortedIds", [...props.ids]);
        } else if (fromIndex !== toIndex) {
          const resorted = moveArrayItem(
            unwrapped.sortedIds,
            fromIndex,
            toIndex
          );
          setState("sortedIds", resorted);
        }
      });
    } else {
      setState("sortedIds", [...props.ids]);
    }
  });

  const actions = {};
  const context: SortableContext = [state, actions];

  return <Context.Provider value={context}>{props.children}</Context.Provider>;
};

const useSortableContext = (): SortableContext | null => {
  return useContext(Context) || null;
};

export { Context, SortableProvider, useSortableContext };
