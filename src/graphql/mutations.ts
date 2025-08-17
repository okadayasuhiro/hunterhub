/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createGameScore = /* GraphQL */ `mutation CreateGameScore(
  $input: CreateGameScoreInput!
  $condition: ModelGameScoreConditionInput
) {
  createGameScore(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateGameScoreMutationVariables,
  APITypes.CreateGameScoreMutation
>;
export const updateGameScore = /* GraphQL */ `mutation UpdateGameScore(
  $input: UpdateGameScoreInput!
  $condition: ModelGameScoreConditionInput
) {
  updateGameScore(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateGameScoreMutationVariables,
  APITypes.UpdateGameScoreMutation
>;
export const deleteGameScore = /* GraphQL */ `mutation DeleteGameScore(
  $input: DeleteGameScoreInput!
  $condition: ModelGameScoreConditionInput
) {
  deleteGameScore(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteGameScoreMutationVariables,
  APITypes.DeleteGameScoreMutation
>;
export const createUserProfile = /* GraphQL */ `mutation CreateUserProfile(
  $input: CreateUserProfileInput!
  $condition: ModelUserProfileConditionInput
) {
  createUserProfile(input: $input, condition: $condition) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    xLinked
    xDisplayName
    xProfileImageUrl
    xLinkedAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUserProfileMutationVariables,
  APITypes.CreateUserProfileMutation
>;
export const updateUserProfile = /* GraphQL */ `mutation UpdateUserProfile(
  $input: UpdateUserProfileInput!
  $condition: ModelUserProfileConditionInput
) {
  updateUserProfile(input: $input, condition: $condition) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    xLinked
    xDisplayName
    xProfileImageUrl
    xLinkedAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUserProfileMutationVariables,
  APITypes.UpdateUserProfileMutation
>;
export const deleteUserProfile = /* GraphQL */ `mutation DeleteUserProfile(
  $input: DeleteUserProfileInput!
  $condition: ModelUserProfileConditionInput
) {
  deleteUserProfile(input: $input, condition: $condition) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    xLinked
    xDisplayName
    xProfileImageUrl
    xLinkedAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUserProfileMutationVariables,
  APITypes.DeleteUserProfileMutation
>;
export const createGameHistory = /* GraphQL */ `mutation CreateGameHistory(
  $input: CreateGameHistoryInput!
  $condition: ModelGameHistoryConditionInput
) {
  createGameHistory(input: $input, condition: $condition) {
    id
    userId
    gameType
    gameData
    playedAt
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateGameHistoryMutationVariables,
  APITypes.CreateGameHistoryMutation
>;
export const updateGameHistory = /* GraphQL */ `mutation UpdateGameHistory(
  $input: UpdateGameHistoryInput!
  $condition: ModelGameHistoryConditionInput
) {
  updateGameHistory(input: $input, condition: $condition) {
    id
    userId
    gameType
    gameData
    playedAt
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateGameHistoryMutationVariables,
  APITypes.UpdateGameHistoryMutation
>;
export const deleteGameHistory = /* GraphQL */ `mutation DeleteGameHistory(
  $input: DeleteGameHistoryInput!
  $condition: ModelGameHistoryConditionInput
) {
  deleteGameHistory(input: $input, condition: $condition) {
    id
    userId
    gameType
    gameData
    playedAt
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteGameHistoryMutationVariables,
  APITypes.DeleteGameHistoryMutation
>;
