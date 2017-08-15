import {div, span, strong, h1, input, button, fieldset, legend} from '@cycle/dom'
import xs from 'xstream'

// sources are incoming messages from drivers?
export function App (sources) {

  const counterName = 'counter'
  const numTicks = 3

  // App data structure, altered by stream events below.
  // This shapes the data design of the output of each stream.
  const data = {
    i: 0,
    isTick: false,
    reset: false,
    counter: 0
  }

  // stream for localStorage changes
  const storageRequest$ = xs.create()

  // xs.periodic is a Stream, which has a map function, like Array.
  const periodic$ = xs.periodic(1000)
    .map(i => {
      return { i: i }
    })
    .endWhen(xs.periodic((numTicks + 1) * 1000).take(1))

  // Once periodic stream is done, THEN we update localStorage.
  periodic$.addListener({
    // next: i => console.log('listener, i:', i),
    // error: err => console.error('listener err:', err),
    complete: () => {
      storageRequest$.shamefullySendNext({
        // target, action optional
        key: counterName,
        value: data.counter
      })
    }
  })

  // This connects the dom stream to the storage stream.
  const reset$ = sources.DOM.select('.reset').events('click').map(ev => {
    storageRequest$.shamefullySendNext({
      // target, action optional
      key: counterName,
      value: 0
    })
    return {
      reset: true
    }
  })

  // react to changes in localStorage
  // needed to render up-to-date counter value in ui.
  const counter$ = sources.storage.local.getItem(counterName).map(i => {
    if (i === null) { i = 0 } // when no localStorage is set in browser yet.
    const counter = parseInt(i, 10)
    return {
      counter: counter
    }
  })

  // DOM vtree
  // merge streams (logical OR) to render vtree.
  const vtree$ = xs.merge(periodic$, counter$, reset$).map((streamData) => {

    streamData = streamData || {} // defensive

    Object.assign(data, streamData) // merge updated properties from a streamData event object into app data.

    // Crappy "compute state from different event input data" code.
    data.isTick = streamData.hasOwnProperty('i') // if stream event has i, we know this is a tick.
    data.counter = data.isTick ? data.counter + 1 : data.counter // only increment on an a periodic tick (incl zero-eth tick)
    data.reset = streamData.reset && streamData.reset === true // be strict on value of reset input. false for all other things.

    // After the data updates are computed.
    console.log('vtree$ streamData:', streamData)

    // TODO Consider emitting event here for counter? What's better, here or the periodic$ listener?

    // Actual html structure of the app.
    return div('.app', {}, [
      // TODO What about using DOM to store state, and sources.DOM to get a stream of changes from it?
      fieldset('', {}, [
        legend('Circlejs Testing Ticks'),
        input('.' + counterName, { attrs: { type: 'hidden', value: data.counter }}),
        div([
          div('Will remember previous tick in localStorage. Refresh browser to resume tick counting. Try resetting during ticks.'),
          strong(data.counter),
          span(' seconds elapsed' + (data.isTick ? ' (tick)' : '')),
          span('', { attrs: { style: 'margin-left: 0.5em'}}, '(Running for ' + numTicks + ' seconds total.)')
        ]),
        button('.reset', 'reset ticks counter')
      ])
    ])

  })

  // sinks are outgoing messages to the dom driver
  return {
    DOM: vtree$,
    storage: storageRequest$
  }

}
