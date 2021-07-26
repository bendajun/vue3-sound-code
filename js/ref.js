import { TrackOpTypes } from '../constant/operators'
import { hasChanged, isObject } from '../utlis'
import { track, trigger } from './effect'
import { reactive } from './reactive'

/**
 * ref Api
 * @param {any} value 传入 ref 的值
 * @returns {RefImpl}
 */
export function ref(value) {
  return createRef(value)
}

/**
 * shallowRef Api
 * @param {*} value 传入 shallowRef 的值
 * @returns {RefImpl}
 */
export function shallowRef(value) {
  return createRef(value, true)
}


/**
 * 穿件一个ref实例
 * @param {*} rawValue 传入 ref 的值
 * @param {*} shallow 是否是浅的
 * @returns {RefImpl}
 */
function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow)
}

const convert = val => isObject(val) ? reactive(val) : val

/**
 * RefImpl实例，使用babel转换后的结果其实就是Object.defineProperty()
 */
class RefImpl {
  constructor(rawValue, shallow) {
    this.rawValue = rawValue // 存放原值
    this.shallow = shallow
    this.__v_isRef = true // 标识是一个ref对象
    // 如果是浅的，那么直接就使用，如果是深度的，而且传入的还是引用类型的，那么就用reactive包裹
    this._value = shallow ? rawValue : convert(rawValue)
  }

  get value() {
    track(this, TrackOpTypes.GET, 'value') // 添加追踪
    return this._value
  }

  set value(newValue) {
    if (hasChanged(newValue, this.rawValue)) { // 判断是否有变化
      this.rawValue = newValue
      this._value = this.shallow ? newValue : convert(newValue)
      trigger(this, TrackOpTypes.SET, 'value', newValue)
    }
  }
}