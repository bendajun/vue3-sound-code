import { TriggerOrTypes, TrackOpTypes } from '../constant/operators'
import { isFunction } from '../utlis'
import { effect, track, trigger } from './effect'

/**
 * computed Api
 *  @param {Function | Object} getterOrOptions 调用computed的时候，我们传入的函数或者一个拥有get，set的对象
 * @returns {ComputedRefImpl} ComputedRefImpl 实例
 */
export function computed(getterOrOptions) {
  let getter
  let setter
  if (isFunction(getterOrOptions)) { // 如果传入的是函数
    getter = getterOrOptions
    setter = () => {}
  } else { // 传入的是拥有get和set方法的对象
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedRefImpl(getter, setter, isFunction(getterOrOptions) || !getterOrOptions.set)
}

/**
 * 创建一个 ComputedRefImpl 实例
 * @param {Function} getter
 * @param {Function} setter
 * @param {Boolean} isReadonly 是否是只读的
 */
class ComputedRefImpl {
  constructor(getter, setter, isReadonly) {
    this.__v_isRef = true
    this.__v_isReadonly = isReadonly
    this._dirty = true // 是否需要重新计算，设计计算属性的缓存
    this._setter = setter
    this.effect = effect(getter, {
      lazy: true, // const ages = computed(() => state.age * 2) 计算属性是不会立刻执行传入的函数的， 只有在访问ages.value的时候才会执行
      computed: true, // 标识是计算属性类型的effect
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true
          trigger(this, TriggerOrTypes.SET, 'value')
        }
      }
    })
  }

  get value() {
    // 是否需要重新计算
    if (this._dirty) {
      this._value = this.effect()
      this._dirty = false
    }
    track(this, TrackOpTypes.GET, 'value')
    return this._value
  }

  set value(newValue) {
    this._setter(newValue)
  }

}