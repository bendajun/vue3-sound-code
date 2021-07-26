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
} = Vue


const state = reactive({ name: 'xiaodu', age: 18 })

const toRefName = toRef(state, 'name')

const toRefState = toRefs(state)

console.log(toRefName)
console.log(toRefState)
