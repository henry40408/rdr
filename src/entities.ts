import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Feed {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Feed title' })
  title!: string;

  @ApiProperty({ description: 'XML URL of the feed' })
  xmlUrl!: string;

  @ApiPropertyOptional({ description: 'HTML URL of the feed' })
  htmlUrl?: string;
}

export class Category {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Category name' })
  name!: string;

  @ApiProperty({
    description: 'List of feeds in the category',
    type: Feed,
    isArray: true,
  })
  feeds: Feed[];
}
