import { isArray } from '../utlis'

/**
 * toRef Api
 * @param {*} target 传入的对象
 * @param {*} key 属性名
 * @returns {ObjectRefImpl} ObjectRefImpl实例
 */
export function toRef(target, key) {
  return new ObjectRefImpl(target, key)
}

/**
 * 批量处理成 ObjectRefImpl
 * @param {*} object 对象或者数组
 */
export function toRefs(object) {
  // 判断是数组还是对象，如果是数组，就创建个同样长度的数组
  const ret = isArray(object) ? new Array(object.length) : {}
  for (let key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}

/**
 * 将某一个key对应的值，转换为了ref
 * 注1
 */
class ObjectRefImpl {
  constructor(target, key) {
    this.target = target
    this.key = key
    this.__v_isRef = true
  }

  get value() {
    return this.target[this.key]
  }

  set value(newValue) {
    this.target[this.key] = newValue
  }
}

/**
 * 注1
  const state = reactive({ name: 'xiaodu' })
  const name = toRef(state, 'name')
  那么 name.value = 'xiaodua' 就等同于 state.name = 'xiaodua' 自然就是响应式的
  但是如果给toRef传入的是一个普通对象，那么自然就不会是响应式的
  toRef的好处是在setup中导出的时候使用了toRef后，会标识__v_isRef为true，那么在模板中取值就可以少取一层value, vue帮我们处理
 */