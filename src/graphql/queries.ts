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
    timestamp
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
      timestamp
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
    username
    xId
    xDisplayName
    xUsername
    xProfileImageUrl
    createdAt
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
      username
      xId
      xDisplayName
      xUsername
      xProfileImageUrl
      createdAt
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
export const getGameHistory = /* GraphQL */ `query GetGameHistory($id: ID!) {
  getGameHistory(id: $id) {
    id
    userId
    gameType
    score
    details
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetGameHistoryQueryVariables,
  APITypes.GetGameHistoryQuery
>;
export const listGameHistories = /* GraphQL */ `query ListGameHistories(
  $filter: ModelGameHistoryFilterInput
  $limit: Int
  $nextToken: String
) {
  listGameHistories(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      gameType
      score
      details
      timestamp
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListGameHistoriesQueryVariables,
  APITypes.ListGameHistoriesQuery
>;
