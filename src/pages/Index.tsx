import { Navigate } from 'react-router-dom'

export default function Index() {
  // Redireciona a raiz para a primeira aba do menu para melhor UX
  return <Navigate to="/group-data" replace />
}
