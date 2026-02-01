import type { APIRoute } from 'astro';
import handleGraphQL from '../../lib/graphql/server';

export const ALL: APIRoute = async (context) => {
  return handleGraphQL(context.request);
};

export const GET: APIRoute = async (context) => {
  return handleGraphQL(context.request);
};

export const POST: APIRoute = async (context) => {
  return handleGraphQL(context.request);
};

export const OPTIONS: APIRoute = async (context) => {
  return handleGraphQL(context.request);
};