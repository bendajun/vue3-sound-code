import Vue from '../js/index'

const {
  reactive,
  shallowReactive,
  readonly,
  shallowReadonly,
  effect,
} = Vue

const state = reactive({ name: 'xiaodu', age: 18, height: 1.88 })


const arr = reactive([1, 2, 3, 4])

effect(() => {
  console.log('effect执行', arr[2])
})

setTimeout(() => {
  arr.length = 2
  console.log(arr)
}, 2000)