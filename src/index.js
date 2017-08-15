import {run} from '@cycle/run'
import {makeDOMDriver} from '@cycle/dom'
import storageDriver from '@cycle/storage'
import {App} from './app'

const main = App

const drivers = {
  DOM: makeDOMDriver('#app-container'),
  storage: storageDriver
}

run(main, drivers)
