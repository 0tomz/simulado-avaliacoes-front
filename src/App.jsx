import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Avaliacoes from './Avaliacoes'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <Avaliacoes></Avaliacoes>
      </div>
    </>
  )
}

export default App
