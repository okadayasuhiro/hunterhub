/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateGameScoreInput = {
  id?: string | null,
  userId: string,
  gameType: string,
  score: number,
  timestamp: string,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelGameScoreConditionInput = {
  userId?: ModelStringInput | null,
  gameType?: ModelStringInput | null,
  score?: ModelFloatInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelGameScoreConditionInput | null > | null,
  or?: Array< ModelGameScoreConditionInput | null > | null,
  not?: ModelGameScoreConditionInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type ModelFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type GameScore = {
  __typename: "GameScore",
  id: string,
  userId: string,
  gameType: string,
  score: number,
  timestamp: string,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type UpdateGameScoreInput = {
  id: string,
  userId?: string | null,
  gameType?: string | null,
  score?: number | null,
  timestamp?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteGameScoreInput = {
  id: string,
};

export type CreateUserProfileInput = {
  id?: string | null,
  username: string,
  xId?: string | null,
  xDisplayName?: string | null,
  xUsername?: string | null,
  xProfileImageUrl?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelUserProfileConditionInput = {
  username?: ModelStringInput | null,
  xId?: ModelStringInput | null,
  xDisplayName?: ModelStringInput | null,
  xUsername?: ModelStringInput | null,
  xProfileImageUrl?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserProfileConditionInput | null > | null,
  or?: Array< ModelUserProfileConditionInput | null > | null,
  not?: ModelUserProfileConditionInput | null,
};

export type UserProfile = {
  __typename: "UserProfile",
  id: string,
  username: string,
  xId?: string | null,
  xDisplayName?: string | null,
  xUsername?: string | null,
  xProfileImageUrl?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type UpdateUserProfileInput = {
  id: string,
  username?: string | null,
  xId?: string | null,
  xDisplayName?: string | null,
  xUsername?: string | null,
  xProfileImageUrl?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteUserProfileInput = {
  id: string,
};

export type CreateGameHistoryInput = {
  id?: string | null,
  userId: string,
  gameType: string,
  score: number,
  details?: string | null,
  timestamp: string,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelGameHistoryConditionInput = {
  userId?: ModelStringInput | null,
  gameType?: ModelStringInput | null,
  score?: ModelFloatInput | null,
  details?: ModelStringInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelGameHistoryConditionInput | null > | null,
  or?: Array< ModelGameHistoryConditionInput | null > | null,
  not?: ModelGameHistoryConditionInput | null,
};

export type GameHistory = {
  __typename: "GameHistory",
  id: string,
  userId: string,
  gameType: string,
  score: number,
  details?: string | null,
  timestamp: string,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type UpdateGameHistoryInput = {
  id: string,
  userId?: string | null,
  gameType?: string | null,
  score?: number | null,
  details?: string | null,
  timestamp?: string | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteGameHistoryInput = {
  id: string,
};

export type ModelGameScoreFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelStringInput | null,
  gameType?: ModelStringInput | null,
  score?: ModelFloatInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelGameScoreFilterInput | null > | null,
  or?: Array< ModelGameScoreFilterInput | null > | null,
  not?: ModelGameScoreFilterInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type ModelGameScoreConnection = {
  __typename: "ModelGameScoreConnection",
  items:  Array<GameScore | null >,
  nextToken?: string | null,
};

export type ModelUserProfileFilterInput = {
  id?: ModelIDInput | null,
  username?: ModelStringInput | null,
  xId?: ModelStringInput | null,
  xDisplayName?: ModelStringInput | null,
  xUsername?: ModelStringInput | null,
  xProfileImageUrl?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserProfileFilterInput | null > | null,
  or?: Array< ModelUserProfileFilterInput | null > | null,
  not?: ModelUserProfileFilterInput | null,
};

export type ModelUserProfileConnection = {
  __typename: "ModelUserProfileConnection",
  items:  Array<UserProfile | null >,
  nextToken?: string | null,
};

export type ModelGameHistoryFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelStringInput | null,
  gameType?: ModelStringInput | null,
  score?: ModelFloatInput | null,
  details?: ModelStringInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelGameHistoryFilterInput | null > | null,
  or?: Array< ModelGameHistoryFilterInput | null > | null,
  not?: ModelGameHistoryFilterInput | null,
};

export type ModelGameHistoryConnection = {
  __typename: "ModelGameHistoryConnection",
  items:  Array<GameHistory | null >,
  nextToken?: string | null,
};

export type ModelSubscriptionGameScoreFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionStringInput | null,
  gameType?: ModelSubscriptionStringInput | null,
  score?: ModelSubscriptionFloatInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionGameScoreFilterInput | null > | null,
  or?: Array< ModelSubscriptionGameScoreFilterInput | null > | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionUserProfileFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  username?: ModelSubscriptionStringInput | null,
  xId?: ModelSubscriptionStringInput | null,
  xDisplayName?: ModelSubscriptionStringInput | null,
  xUsername?: ModelSubscriptionStringInput | null,
  xProfileImageUrl?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserProfileFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserProfileFilterInput | null > | null,
};

export type ModelSubscriptionGameHistoryFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionStringInput | null,
  gameType?: ModelSubscriptionStringInput | null,
  score?: ModelSubscriptionFloatInput | null,
  details?: ModelSubscriptionStringInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionGameHistoryFilterInput | null > | null,
  or?: Array< ModelSubscriptionGameHistoryFilterInput | null > | null,
};

export type CreateGameScoreMutationVariables = {
  input: CreateGameScoreInput,
  condition?: ModelGameScoreConditionInput | null,
};

export type CreateGameScoreMutation = {
  createGameScore?:  {
    __typename: "GameScore",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type UpdateGameScoreMutationVariables = {
  input: UpdateGameScoreInput,
  condition?: ModelGameScoreConditionInput | null,
};

export type UpdateGameScoreMutation = {
  updateGameScore?:  {
    __typename: "GameScore",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type DeleteGameScoreMutationVariables = {
  input: DeleteGameScoreInput,
  condition?: ModelGameScoreConditionInput | null,
};

export type DeleteGameScoreMutation = {
  deleteGameScore?:  {
    __typename: "GameScore",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type CreateUserProfileMutationVariables = {
  input: CreateUserProfileInput,
  condition?: ModelUserProfileConditionInput | null,
};

export type CreateUserProfileMutation = {
  createUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    username: string,
    xId?: string | null,
    xDisplayName?: string | null,
    xUsername?: string | null,
    xProfileImageUrl?: string | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type UpdateUserProfileMutationVariables = {
  input: UpdateUserProfileInput,
  condition?: ModelUserProfileConditionInput | null,
};

export type UpdateUserProfileMutation = {
  updateUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    username: string,
    xId?: string | null,
    xDisplayName?: string | null,
    xUsername?: string | null,
    xProfileImageUrl?: string | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type DeleteUserProfileMutationVariables = {
  input: DeleteUserProfileInput,
  condition?: ModelUserProfileConditionInput | null,
};

export type DeleteUserProfileMutation = {
  deleteUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    username: string,
    xId?: string | null,
    xDisplayName?: string | null,
    xUsername?: string | null,
    xProfileImageUrl?: string | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type CreateGameHistoryMutationVariables = {
  input: CreateGameHistoryInput,
  condition?: ModelGameHistoryConditionInput | null,
};

export type CreateGameHistoryMutation = {
  createGameHistory?:  {
    __typename: "GameHistory",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    details?: string | null,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type UpdateGameHistoryMutationVariables = {
  input: UpdateGameHistoryInput,
  condition?: ModelGameHistoryConditionInput | null,
};

export type UpdateGameHistoryMutation = {
  updateGameHistory?:  {
    __typename: "GameHistory",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    details?: string | null,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type DeleteGameHistoryMutationVariables = {
  input: DeleteGameHistoryInput,
  condition?: ModelGameHistoryConditionInput | null,
};

export type DeleteGameHistoryMutation = {
  deleteGameHistory?:  {
    __typename: "GameHistory",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    details?: string | null,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type GetGameScoreQueryVariables = {
  id: string,
};

export type GetGameScoreQuery = {
  getGameScore?:  {
    __typename: "GameScore",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type ListGameScoresQueryVariables = {
  filter?: ModelGameScoreFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListGameScoresQuery = {
  listGameScores?:  {
    __typename: "ModelGameScoreConnection",
    items:  Array< {
      __typename: "GameScore",
      id: string,
      userId: string,
      gameType: string,
      score: number,
      timestamp: string,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetUserProfileQueryVariables = {
  id: string,
};

export type GetUserProfileQuery = {
  getUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    username: string,
    xId?: string | null,
    xDisplayName?: string | null,
    xUsername?: string | null,
    xProfileImageUrl?: string | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type ListUserProfilesQueryVariables = {
  filter?: ModelUserProfileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserProfilesQuery = {
  listUserProfiles?:  {
    __typename: "ModelUserProfileConnection",
    items:  Array< {
      __typename: "UserProfile",
      id: string,
      username: string,
      xId?: string | null,
      xDisplayName?: string | null,
      xUsername?: string | null,
      xProfileImageUrl?: string | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetGameHistoryQueryVariables = {
  id: string,
};

export type GetGameHistoryQuery = {
  getGameHistory?:  {
    __typename: "GameHistory",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    details?: string | null,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type ListGameHistoriesQueryVariables = {
  filter?: ModelGameHistoryFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListGameHistoriesQuery = {
  listGameHistories?:  {
    __typename: "ModelGameHistoryConnection",
    items:  Array< {
      __typename: "GameHistory",
      id: string,
      userId: string,
      gameType: string,
      score: number,
      details?: string | null,
      timestamp: string,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateGameScoreSubscriptionVariables = {
  filter?: ModelSubscriptionGameScoreFilterInput | null,
};

export type OnCreateGameScoreSubscription = {
  onCreateGameScore?:  {
    __typename: "GameScore",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnUpdateGameScoreSubscriptionVariables = {
  filter?: ModelSubscriptionGameScoreFilterInput | null,
};

export type OnUpdateGameScoreSubscription = {
  onUpdateGameScore?:  {
    __typename: "GameScore",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnDeleteGameScoreSubscriptionVariables = {
  filter?: ModelSubscriptionGameScoreFilterInput | null,
};

export type OnDeleteGameScoreSubscription = {
  onDeleteGameScore?:  {
    __typename: "GameScore",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnCreateUserProfileSubscriptionVariables = {
  filter?: ModelSubscriptionUserProfileFilterInput | null,
};

export type OnCreateUserProfileSubscription = {
  onCreateUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    username: string,
    xId?: string | null,
    xDisplayName?: string | null,
    xUsername?: string | null,
    xProfileImageUrl?: string | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnUpdateUserProfileSubscriptionVariables = {
  filter?: ModelSubscriptionUserProfileFilterInput | null,
};

export type OnUpdateUserProfileSubscription = {
  onUpdateUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    username: string,
    xId?: string | null,
    xDisplayName?: string | null,
    xUsername?: string | null,
    xProfileImageUrl?: string | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnDeleteUserProfileSubscriptionVariables = {
  filter?: ModelSubscriptionUserProfileFilterInput | null,
};

export type OnDeleteUserProfileSubscription = {
  onDeleteUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    username: string,
    xId?: string | null,
    xDisplayName?: string | null,
    xUsername?: string | null,
    xProfileImageUrl?: string | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnCreateGameHistorySubscriptionVariables = {
  filter?: ModelSubscriptionGameHistoryFilterInput | null,
};

export type OnCreateGameHistorySubscription = {
  onCreateGameHistory?:  {
    __typename: "GameHistory",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    details?: string | null,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnUpdateGameHistorySubscriptionVariables = {
  filter?: ModelSubscriptionGameHistoryFilterInput | null,
};

export type OnUpdateGameHistorySubscription = {
  onUpdateGameHistory?:  {
    __typename: "GameHistory",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    details?: string | null,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnDeleteGameHistorySubscriptionVariables = {
  filter?: ModelSubscriptionGameHistoryFilterInput | null,
};

export type OnDeleteGameHistorySubscription = {
  onDeleteGameHistory?:  {
    __typename: "GameHistory",
    id: string,
    userId: string,
    gameType: string,
    score: number,
    details?: string | null,
    timestamp: string,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};
