import Vue from '../js/index'

const {
  reactive,
  shallowReactive,
  readonly,
  shallowReadonly,
  effect,
  ref,
  shallowRef,
  toRef,
  toRefs,
  computed,
} = Vue


const state = reactive({ age: 20 })

/**
 * 这里的effect模拟的是页面的渲染副作用函数 renderEffect，也就是当我们在页面中使用了这个计算属性的话，
 * 那么renderEffect就会订阅这个计算属性，也就是订阅了computed的返回值
 * 当计算属性的的依赖变化，执行计算属性的scheduler，
 * 出发trigger，重新执行renderEffect，也就是这里模拟的effect
 */
effect(() => {
  const ages = computed(() => {
    console.log('计算属性执行了')
    return state.age * 2
  })
  console.log(ages.value)
})



state.age = 22
