/* eslint-disable @typescript-eslint/ban-types */
// https://gist.github.com/philipbulley/3b04ef45b06b24e4b9f3
/**
 * Bind all methods on `scope` to that `scope`.
 *
 * Normal fat arrow/lambda functions in TypeScript are simply member functions
 * that replace the value of `this`, with `_this` (a reference to `this` from
 * within the constructor's scope). They're not on the prototype and as such do not
 * support inheritance. So no calling `super.myMethod()` if it's been
 * declared with a `=>`.
 *
 * `FunctionUtil.bindAllMethods( this )` should be called from the base class' constructor.
 * It will bind each method as such that it will always execute using the class scope.
 *
 * Essentially, we should now write class methods without `=>`. When executed,
 * the scope will be preserved and they will importantly continue to support
 * inheritance. Fat arrow/lambda functions (`=>`) are still great when you
 * don't require inheritance, for example, when using anonymous function callbacks.
 *
 * @param scope     Usually, pass the value of `this` from your base class.
 */
export function bindAllMethods(scope: object) {
  for (const p in scope) {
    if (Object.hasOwn(scope, p)) {
      // Find the object in which prop was originally defined on
      const ownObject = getPropertyDefinitionObject(scope, p);

      // Now we can check if it is a getter/setter
      const descriptor = Object.getOwnPropertyDescriptor(ownObject, p);
      if (descriptor && (descriptor.get ?? descriptor.set)) {
        continue;
      } // Don't bind if `scope[p]` is a getter/setter, we'd be attemping to bind the value returned by the getter

      // Only bind if scope[p] is a function that's not already a class member
      // the bound function will be added as a class member, referencing the function on the prototype
      if (!Object.hasOwn(scope, p) && typeof (scope as any)[p] === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        (scope as any)[p] = (scope as any)[p].bind(scope);
      }
    }
  }
}

/**
 * Searches the supplied object, and then down it's prototype chain until it
 * finds the object where `prop` is its own property. In other words, finds
 * the object in which `prop` was actually defined on, skipping objects that
 * merely inherit `prop`. This is useful when using methods like
 * `Object.getOwnPropertyDescriptor()` which only work on "own" properties.
 *
 * @param scope   The scope on which to start checking for
 * @param prop    The name of the property we're searching for
 * @returns {*}
 */
function getPropertyDefinitionObject(scope: object, property: string): object | undefined {
  if (!scope) {
    return;
  }

  return Object.hasOwn(scope, property)
    ? scope
    : getPropertyDefinitionObject(Object.getPrototypeOf(scope) as unknown as Record<string, unknown>, property);
}

