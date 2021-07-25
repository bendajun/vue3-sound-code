import { isObject } from '../utlis'
import {
  reactiveHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from './baseHandlers'


// 为什么使用WeakMap: 当WeakMap中引用的对象不存在了，那么WeakMap实例会自动的回收，不会存在内存泄漏
/**
 * 如果某个对象已经被代理过了，就不要再次代理了,这里的reactiveMap和readonlyMap就是防止这些操作的
 * 将原对象也就是需要代理的对象和代理过的对象都一一对应的存着
 * 防止如： const state = reactive({ age: 18 }), 然后又 const state2 = reactive(state)
 */
 const reactiveMap = new WeakMap()
 const readonlyMap = new WeakMap()


/**
 * 创建 reactive 的Api
 */
export const reactive = (target) => {
  return createReactiveObject(target, false, reactiveHandlers)
}

/**
 * 创建 shallowReactive 的Api
 */
export const shallowReactive = (target) => {
  return createReactiveObject(target, false, shallowReactiveHandlers)
}

/**
 * 创建 readonly 的Api
 */
export const readonly = (target) => {
  return createReactiveObject(target, true, readonlyHandlers)
}

/**
 * 创建 shallowReadonly 的Api
 */
export const shallowReadonly = (target) => {
  return createReactiveObject(target, true, shallowReadonlyHandlers)
}


 
/**
* 利用函数柯里化，来创建不同的响应式对象
* @param {*} target 原目标对象
* @param {*} isReadonly 是不是仅读的
* @param {*} baseHandlers 各自的处理方式
*/
export function createReactiveObject(target, isReadonly, baseHandlers) {
  if (!isObject(target)) { // 如果传入reactive，shallowReactive等的不是对象，直接返回
    return target
  }

  
  const proxyMap = isReadonly ? readonlyMap : reactiveMap

  const existProxy = proxyMap.get(target)
  if (existProxy) { // 说明已经被代理过了，那么就直接取出之前代理过的Proxy对象，将其返回
    return existProxy
  }

  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy) // 将要代理的对象和代理对象一一对应存起来，防止多次代理

  return proxy

}
