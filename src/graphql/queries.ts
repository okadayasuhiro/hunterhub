/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getGameScore = /* GraphQL */ `query GetGameScore($id: ID!) {
  getGameScore(id: $id) {
    id
    userId
    gameType
    score
    metadata
    sessionId
    timestamp
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetGameScoreQueryVariables,
  APITypes.GetGameScoreQuery
>;
export const listGameScores = /* GraphQL */ `query ListGameScores(
  $filter: ModelGameScoreFilterInput
  $limit: Int
  $nextToken: String
) {
  listGameScores(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      gameType
      score
      metadata
      sessionId
      timestamp
      displayName
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListGameScoresQueryVariables,
  APITypes.ListGameScoresQuery
>;
export const getUserProfile = /* GraphQL */ `query GetUserProfile($id: ID!) {
  getUserProfile(id: $id) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetUserProfileQueryVariables,
  APITypes.GetUserProfileQuery
>;
export const listUserProfiles = /* GraphQL */ `query ListUserProfiles(
  $filter: ModelUserProfileFilterInput
  $limit: Int
  $nextToken: String
) {
  listUserProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      username
      totalGamesPlayed
      createdAt
      lastActiveAt
      fingerprintQuality
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUserProfilesQueryVariables,
  APITypes.ListUserProfilesQuery
>;
export const userProfilesByUserId = /* GraphQL */ `query UserProfilesByUserId(
  $userId: String!
  $sortDirection: ModelSortDirection
  $filter: ModelUserProfileFilterInput
  $limit: Int
  $nextToken: String
) {
  userProfilesByUserId(
    userId: $userId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userId
      username
      totalGamesPlayed
      createdAt
      lastActiveAt
      fingerprintQuality
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.UserProfilesByUserIdQueryVariables,
  APITypes.UserProfilesByUserIdQuery
>;
