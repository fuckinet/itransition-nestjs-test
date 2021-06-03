import { IsNumberString } from 'class-validator';

export class userIdDto {
  @IsNumberString()
  id: number;
}
