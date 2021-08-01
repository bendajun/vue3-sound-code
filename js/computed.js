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
    this._dirty = true // 是否需要重新计算，涉及计算属性的缓存
    this._setter = setter
    this.effect = effect(getter, {
      lazy: true, // const ages = computed(() => state.age * 2) 计算属性是不会立刻执行传入的函数的， 只有在访问ages.value的时候才会执行
      computed: true, // 标识是计算属性类型的effect
      scheduler: () => {
        /**
         * 在scheduler函数中并没有执行计算属性的getter函数求取新值,而是将_dirty设置为false,
         * 然后通知依赖计算属性的副作用函数进行更新, 当依赖计算属性的副作用函数收到通知的时候就会访问计算属性的get函数，
         * 此时会根据_dirty值来确定是否需要重新计算。
         */
        if (!this._dirty) { // 这个就是缓存设计，只有当计算属性收集的依赖项变化了，_dirty变为true，否则_dirty为false，计算属性一直不会重新取值
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
    /**
     * 访问计算属性值的阶段会调用track函数进行依赖收集，此时收集的是访问计算属性值的副作用函数
     * 当计算属性在页面中使用的时候，页面渲染函数 renderEffect 就会收集这个计算属性
     */
    track(this, TrackOpTypes.GET, 'value')
    return this._value
  }

  set value(newValue) {
    this._setter(newValue)
  }

}