
// 实现 new Proxy(target, handler)

import { TrackOpTypes, TriggerOrTypes } from '../constant/operators'
import { extend, hasChanged, hasOwn, isArray, isIntegerKey, isObject } from '../utlis'
import { track, trigger } from './effect'

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(false)
const readonlyObj = { // readonly 的set处理报错，不可修改属性
  set: (target, key) => {
    console.warn(`set on key ${key} falied`)
  }
}


/**
 * reactive Api的处理方式
 */
export const reactiveHandlers = {
  get,
  set,
}

/**
 * shallowReactive Api的处理方式
 */
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
}

/**
 * readonly Api的处理方式
 */
export const readonlyHandlers = extend({
  get: readonlyGet,
}, readonlyObj)

/**
 * shallowReadonly Api的处理方式
 */
export const shallowReadonlyHandlers = extend({
  get: shallowReadonlyGet
}, readonlyObj)


/**
 * proxy的get 处理
 * @param {*} isReadonly 是否只读的
 * @param {*} shallow 是否深度递归处理
 */
function createGetter(isReadonly = false, shallow = false) {
  const get = (target, key, receiver) => { // receiver代理后的proxy对象
    // Reflect用来替换Object的
    const res = Reflect.get(target, key, receiver) // 等同于 target[key]

    /**
     * 就更新对应的试图。是只读的，就不会更改数据，那么自然就不需要收集依赖
     * 如果不是只读的，那么这里就可以收集依赖，等会数据更新后
     */
    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key) // 收集依赖，取值的时候
    }

    if (shallow) { // 说明是浅的，不需要深度监听，直接返回当前数据即可
      return res
    }

    /**
     * 如果值还是对象，那么就在此刻才继续进行代理,这里性能相对于vue2就有了很大的提升
     * vue2是先将数据放在data中，直接一开始就进行递归处理，而这里是访问了才进行处理下一层
     */
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }

  return get
}


/**
 * proxy的set 处理
 * @param {*} shallow 是否是浅的
 */
function createSetter(shallow = false) {
  const set = (target, key, value, receiver) => {
    const oldValue = target[key]
    // 等同于 target[key] = value,但是这个有返回值，代表是否修改成功，因为有的属性
    // 是不可修改的，如属性的writeable: false
    const res = Reflect.set(target, key, value, receiver)

    /**
     * 判断对象或者数组是否有这个key isIntegerKey是用来判断是不是数组的索引值
     * isArray(target) && isIntegerKey(key) 是数组且是索引值，如果Number(key) < target.length成立，那么说明数组原来就有这个索引，如果不成立，那么就是新增了
     */
    const hasKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key)
    if (!hasKey) {
      // 新增
      trigger(target, TriggerOrTypes.ADD, key, value)
    } else if (hasChanged(oldValue, value)) { // 判断是否新增是否改变，这里可以过滤掉数组push等方法改变length的第二次修改
      // 修改
      trigger(target, TriggerOrTypes.SET, key, value, oldValue)
    }
    return res
  }

  return set
}



