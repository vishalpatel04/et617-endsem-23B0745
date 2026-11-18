import { Key } from './ui.jsx'

// Turns <b>bold</b>, <i>italic</i> and <k>highlighted key words</k> inside a translated sentence into elements.
export default function Rich({ text }) {
  return text.split(/(<b>.*?<\/b>|<i>.*?<\/i>|<k>.*?<\/k>)/g).map((part, index) => {
    if (part.startsWith('<b>')) return <b key={index}>{part.slice(3, -4)}</b>
    if (part.startsWith('<i>')) return <i key={index}>{part.slice(3, -4)}</i>
    if (part.startsWith('<k>')) return <Key key={index}>{part.slice(3, -4)}</Key>
    return part
  })
}
