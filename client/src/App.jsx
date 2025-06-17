import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client'
import { useQuery } from '@apollo/client'
import './App.css'

// Import pages
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import PreferencesPage from './pages/PreferencesPage'
import NotFoundPage from './pages/NotFoundPage'

// Import components
import Header from './components/Header'
import Footer from './components/Footer'
import TabNavigation from './components/TabNavigation'
import { GET_CATEGORIES } from './graphql/queries'

// Create Apollo Client
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
})

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})

// App wrapper to use Apollo hooks
function AppContent() {
  const { data } = useQuery(GET_CATEGORIES);
  const categories = data?.categories || [];

  return (
    <Router>
      <div className="app-container">
        <Header />
        <TabNavigation categories={categories} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <AppContent />
    </ApolloProvider>
  )
}

export default App