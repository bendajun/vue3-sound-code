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
const ages = computed(() => {
  console.log('计算属性执行了')
  return state.age * 2
})

console.log(ages.value)
