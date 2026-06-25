export interface Group {
  idGroup: string;
  groupName: string;
}

export interface GroupStudent {
  idStudent: string;
  totalPoints: number;
  position: number;
  firstName?: string;
  lastName?: string;
}
