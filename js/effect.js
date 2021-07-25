import { TriggerOrTypes } from '../constant/operators'
import { isArray, isIntegerKey } from '../utlis'

let effectId = 0
let activeEffect = null // 存储当前的effct
const effectStack = [] // 注1
const targetMap = new WeakMap() // 注2

/**
 * 此函数让effect变成响应式的effect，可以做到数据变化，重新执行
 * @param {*} fn 执行effect时传入的函数
 * @param {*} options 执行effect时传入的其他的额外选项
 */
export const effect = (fn, options = {}) => {
  const effect = createReactiveEffect(fn, options)

  if (!options.lazy) { // effect默认会先执行一次，传了lazy就默认不执行
    return effect()
  }
}


/**
 * 创建一个响应式的effect
 * @param {*} fn 执行effect时传入的函数
 * @param {*} options 执行effect时传入的其他的额外选项
 * @returns 响应式的effect
 */
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) { // 先看栈里面是否有，没有就添加 为了防止effect(() => console.log('effect执行', state.age = state.age + 1))这种情况无限触发
      try {
        effectStack.push(effect) // 注1
        activeEffect = effect // 赋值给当前的effect
        return fn() // 执行传入effect的函数, 传入函数的返回值就是effect的返回结果
      } finally { // 使用try finally是为了防止用户传入的fn函数执行报错，导致下面的effectStack.pop()无法执行
        effectStack.pop() // 注1
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  effect.id = effectId++ // 制作一个effect标识，用于区分effect
  effect._isEffect = true // 用于标识这个是响应式的effect
  effect.raw = fn // 保留effect对应的原函数
  effect.options = options // 保留用户传入的属性

  return effect
}

/**
 * 让对象中的属性收集当前它对应的effect,进行依赖收集
 * @param {*} target 原目标对象，如传入reactive时的那个对象
 * @param {TrackOpTypes} type TrackOpTypes类型，这里为取值，GET
 * @param {*} key 取的那个属性值
 */
export function track(target, type, key) { // 我们这里可以拿到当前的effect
  if (!activeEffect) return // 如果取值的时候，没有activeEffect，说明此属性不用收集依赖，因为当前取值没在effec中进行取值操作

  let depsMap = targetMap.get(target)
  if (!depsMap) { // 如果没有，给个默认值
    targetMap.set(target, (depsMap = new Map))
  }

  let dep = depsMap.get(key)
  if (!dep) { // 查看当前属性对应的effect集合，如果没有，给个默认值
    depsMap.set(key, (dep = new Set))
  }

  if (!dep.has(activeEffect)) { // 查看是否有当前的effect了，没有才添加。 防止 注3 的情况
    dep.add(activeEffect)
  }
}

/**
 * 调用proxy的set 新增或者修改对象属性的时候，调用对应的effect
 * @param {*} target 原目标对象，如传入reactive时的那个对象
 * @param {TriggerOrTypes} type TriggerOrTypes 属性是新增还是修改
 * @param {*} key 属性名
 * @param {*} newValue 新的值
 * @param {*} oldValue 老的值
 */
export function trigger(target, type, key, newValue, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return // 如果这个对象没有收集过effect，那么就不做任何操作

  const effects = new Set() // 将所有的需要执行的effect全部存到一个新的集合中，最终一起执行
  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => effects.add(effect))
    }
  }

  // 1. 看修改的是不是数组的长度，因为改长度的影响比较大，如果原来的length是3，现在改为2了，那么可能我们在某个effect中取了arr[2],那么也是需要执行的
  if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, depsKey) => {
      /**
       * 说明key是length，假如 depsKey 是索引2，但是newValue也就是数组的长度新值为1，
       * 那么就没有索引2了，那么索引2收集的对应那个effect也需要执行
       */
      if (depsKey === 'length' || depsKey >= newValue) { 
        add(dep)
      }
    })
  } else {
    if (key !== undefined) { // 可能是对象，且这里肯定是修改
      add(depsMap.get(key))
    }

    switch(type) { // 如果是新增
      case TriggerOrTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) { // 且是数组，且是添加了一个索引，那就触发长度的更新
          add(depsMap.get('length'))
        }
    }
  }

  // 循环执行收集的effect
  effects.forEach(effect => effect())
}

/**
 * 注1.
 * 使用effectStack存储effect，是为了防止下面这种情况
 * 防止执行height代码的时候，height对应的activeEffect为执行age那个effect，这样是不对的，height对应的
 * activeEffect应该是和name为同一个，也就是外层的那一个。所以我们用数组作为栈，每次执行完一个effect就pop出栈
  effect(() => {
    let name = state.name
    effect(() => {
      let age = state.age
    })
    let height = state.height
  })
 */


/**
 * 注2
  targetMap 的作用是为了保存当前代理对象的有哪些属性有对应的effect
  targetMap => key { name: 'xiaodu', age: 18, height: 1.88 } value(Map) { name => Set, age => Set }
  targetMap 的key则为target({ name: 'xiaodu', age: 18, height: 1.88 })，为传入的原对象，其值对应为一个Map实例
  这个Map实例的属性名则为target对象上属性名(name, age, height)
  值则为一个个Set实例，里面存放着当前属性名对应的多个effect
 */


/**
 * 注3
  effect(() => {
    console.log(state.name)
    console.log(state.name)
  })
 */