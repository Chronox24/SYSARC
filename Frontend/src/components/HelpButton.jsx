import { useState } from 'react'
import '../styles/HelpButton.css'
import questionIcon from '../assets/question.svg'
import QuestionModal from './QuestionModal'

export default function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="help-button"
        onClick={() => setOpen(true)}
        aria-label="Ask a question"
        title="Ask a question"
      >
        <img src={questionIcon} alt="?" />
      </button>
      <QuestionModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
