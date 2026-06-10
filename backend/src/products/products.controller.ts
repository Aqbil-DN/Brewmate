import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getProducts(@Query() query: ProductQueryDto) {
    return this.productsService.getProducts(query);
  }

  @Get(':id')
  getProductDetail(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => {
          return new BadRequestException({
            code: AppErrorCodes.VALIDATION_ERROR,
            message: 'Product id must be a valid UUID.',
          });
        },
      }),
    )
    id: string,
  ) {
    return this.productsService.getProductDetail(id);
  }
}

