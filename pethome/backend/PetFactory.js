// =============================================
// Factory Method Pattern - Pet & User Factory
// =============================================
// بدل ما نكتب creation logic في كل مكان،
// الـ Factory بتعمل الـ object الصح حسب الـ type

class Dog {
  constructor(data) {
    this.type = 'dog';
    this.emoji = '🐶';
    this.name = data.name;
    this.breed = data.breed;
    this.gender = data.gender;
    this.age = data.age;
    this.health_status = data.health_status;
    this.description = data.description;
    this.location = data.location;
    this.shelter_id = data.shelter_id;
    this.status = 'available';
    // Dogs specific defaults
    this.needs_yard = data.needs_yard || false;
    this.good_with_kids = data.good_with_kids || true;
  }
}

class Cat {
  constructor(data) {
    this.type = 'cat';
    this.emoji = '🐱';
    this.name = data.name;
    this.breed = data.breed;
    this.gender = data.gender;
    this.age = data.age;
    this.health_status = data.health_status;
    this.description = data.description;
    this.location = data.location;
    this.shelter_id = data.shelter_id;
    this.status = 'available';
    // Cats specific defaults
    this.indoor_only = data.indoor_only || true;
  }
}

class Bird {
  constructor(data) {
    this.type = 'bird';
    this.emoji = '🐦';
    this.name = data.name;
    this.breed = data.breed;
    this.gender = data.gender || 'unknown';
    this.age = data.age;
    this.health_status = data.health_status;
    this.description = data.description;
    this.location = data.location;
    this.shelter_id = data.shelter_id;
    this.status = 'available';
  }
}

class Rabbit {
  constructor(data) {
    this.type = 'rabbit';
    this.emoji = '🐰';
    this.name = data.name;
    this.breed = data.breed;
    this.gender = data.gender;
    this.age = data.age;
    this.health_status = data.health_status;
    this.description = data.description;
    this.location = data.location;
    this.shelter_id = data.shelter_id;
    this.status = 'available';
  }
}

class SmallPet {
  constructor(data) {
    this.type = 'small';
    this.emoji = '🐹';
    this.name = data.name;
    this.breed = data.breed;
    this.gender = data.gender;
    this.age = data.age;
    this.health_status = data.health_status;
    this.description = data.description;
    this.location = data.location;
    this.shelter_id = data.shelter_id;
    this.status = 'available';
  }
}

// =============================================
// PetFactory - بتاخد type وبترجع الـ object الصح
// =============================================
class PetFactory {
  static createPet(type, data) {
    switch (type.toLowerCase()) {
      case 'dog':    return new Dog(data);
      case 'cat':    return new Cat(data);
      case 'bird':   return new Bird(data);
      case 'rabbit': return new Rabbit(data);
      case 'small':  return new SmallPet(data);
      default:
        throw new Error(`Unknown pet type: ${type}`);
    }
  }
}

module.exports = PetFactory;