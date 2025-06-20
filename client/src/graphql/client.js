import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const httpLink = createHttpLink({
  uri: `${API_BASE_URL}/graphql`,
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
}); 