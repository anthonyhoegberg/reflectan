# Reflectan

A simple react state management library to manage states simply while
only rerendering change components

## Usage
First we need to create our initial state 
```ts
const initialState = {
  user: {
    name: 'John Doe',
    age: 30
  },
  settings: {
    theme: 'light',
    notifications: true
  }
  array: ["hello", "world"]
};
```
And we create our store like:  

```ts
// Type is infered here from initialState 
const useStore = createStore(initialState);
// and if needed we can pass in type with
const useStore = createStore<TypeHere>(initialState);
```
Now to use our store inside an component we do:
the type is infered from what we select
```ts
// Target what you want to use
const [user, setUser] = useStore(state => state.user); 
// We can also target arrays or array indexes
const [array, setArray] = useStore(state => state.array); 
// ArrayItem is string
const [arrayItem, setArrayItem] = useStore(state => state.array[index]); 
```
And since we use immer we can only modify the data using the set methods kinda like `useState` but we use drafts from immer

```ts
setUser(draftUser => {
    draftUser.name = "Johny Doe";
    draftUser.age++;

    // optional for objects but for primitive types
    // (string, number, boolean etc) we must return our draft
    return draftUser; // return our new data
});
```

When data gets changed only the component using the data will be rerendered automatically, including parent listening objects

So if we have an object using `useStore(state => state.user)` and another component using `useStore(state => state.user.name)` and we set the name both the userStore for the user and name will be updated