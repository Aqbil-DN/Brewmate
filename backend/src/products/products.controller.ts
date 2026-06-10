import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductQueryDto } from './dto/product-query.dto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getProducts(@Query() query: ProductQueryDto) {
    return this.productsService.getProducts(query);
  }

  @Get(':id')
  getProductDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductDetail(id);
  }
}
