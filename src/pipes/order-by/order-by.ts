import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the OrderByPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'orderBy',
})
export class OrderByPipe implements PipeTransform {
  /**
   * Takes an array and sort it by the field.
   */
  transform(list: any[], field: string): any[] {
    let sorted = list.sort((t1, t2) => {
      if (t1[field] > t2[field])
        return 1;
      if (t1[field]< t2[field])
        return -1;
      return 0;
    });
    return sorted;
  }
}
