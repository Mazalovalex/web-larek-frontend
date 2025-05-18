// Товар (Product) — объект
interface IProduct {
	id: number;
	title: string;
	description: string;
	image: string;
	category: string;
	price: number | null; // null если товар недоступен
}

// Список товаров (ProductList) — коллекция
interface IProductList {
	total: number;
	items: IProduct[];
}

// Корзина (Cart) — коллекция
interface ICart {
	items: IProduct[];
}

// Тип ProductId — это тип поля "id" из интерфейса IProduct.
type ProductId = IProduct['id'];

// Заказ (Order) — объект
interface IOrder {
	items: ProductId[];
	total: number;
	address: string;
	payment: 'Онлайн' | 'При получении';
	email: string;
	phone: string;
}

// Ответ на заказ (OrderResponse) — объект
interface IOrderResponse {
	id: number;
	total: number;
}

//Ошибки (Errors) — объекты
enum ErrorType {
	NoAddress = 'No address',
	WrongTotal = 'Wrong total',
	ProductNotFound = 'Product not found',
}
